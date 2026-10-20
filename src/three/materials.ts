import * as THREE from 'three'
import { createToonGradientMap } from './gradientMap'
import { DRINK_VARIANTS, SAUCE_VARIANTS } from './geometry'
import { createChipTextures, createGrainBump } from './textures'
import type { DrinkKey, FlavorKey } from '@/data/types'

export type CupStyle = 'toon' | 'realistic'

export const INK = '#7A1F1A'

let sharedGradient: THREE.DataTexture | null = null
function gradientMap(): THREE.DataTexture {
  sharedGradient ??= createToonGradientMap(3)
  return sharedGradient
}

export function toonMaterial(color: string, options: THREE.MeshToonMaterialParameters = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...options })
}

// ---------------------------------------------------------------------------
// Clear plastic (realistic)
// ---------------------------------------------------------------------------

const PLASTIC_UNIFORMS = /* glsl */ `
  uniform vec3 uBodyTint;
  uniform vec3 uEdgeTint;
  uniform float uBaseAlpha;
  uniform float uEdgeAlpha;
  uniform float uReflAlpha;
`

// The base colour is black, so outgoingLight holds only reflections (direct
// specular, env map and clearcoat). Those drive the alpha, so highlights stay
// bright while the body stays see-through, and grazing edges thicken like real
// PET. This works over the transparent canvas, unlike transmission.
const PLASTIC_OUTPUT = /* glsl */ `
  vec3 plasticView = normalize( vViewPosition );
  float plasticFacing = clamp( abs( dot( normal, plasticView ) ), 0.0, 1.0 );
  float plasticEdge = pow( 1.0 - plasticFacing, 3.0 );
  float plasticGlint = dot( outgoingLight, vec3( 0.2126, 0.7152, 0.0722 ) ) * uReflAlpha;
  float plasticBody = uBaseAlpha + uEdgeAlpha * plasticEdge;
  float plasticAlpha = clamp( plasticBody + plasticGlint, 0.0, 1.0 );
  vec3 plasticColor = uBodyTint * uBaseAlpha + uEdgeTint * uEdgeAlpha * plasticEdge + outgoingLight;
  gl_FragColor = vec4( plasticColor / max( plasticAlpha, 0.001 ), plasticAlpha );
`

export interface PlasticOptions {
  bodyTint?: string
  edgeTint?: string
  baseAlpha?: number
  edgeAlpha?: number
  reflAlpha?: number
  roughness?: number
  envMapIntensity?: number
  side?: THREE.Side
}

export function clearPlastic({
  bodyTint = '#F3F8FC',
  edgeTint = '#8D9EAA',
  baseAlpha = 0.035,
  edgeAlpha = 0.65,
  reflAlpha = 0.9,
  roughness = 0.05,
  envMapIntensity = 2.6,
  side = THREE.DoubleSide,
}: PlasticOptions = {}): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#000000',
    roughness,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 1,
    envMapIntensity,
    transparent: true,
    depthWrite: false,
    side,
  })
  material.userData.plastic = {
    uBodyTint: { value: new THREE.Color(bodyTint) },
    uEdgeTint: { value: new THREE.Color(edgeTint) },
    uBaseAlpha: { value: baseAlpha },
    uEdgeAlpha: { value: edgeAlpha },
    uReflAlpha: { value: reflAlpha },
  }
  // Same source for every instance → one shared GL program, per-material uniforms.
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, material.userData.plastic)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${PLASTIC_UNIFORMS}`)
      .replace('#include <opaque_fragment>', PLASTIC_OUTPUT)
  }
  return material
}

// ---------------------------------------------------------------------------
// Toon glass
// ---------------------------------------------------------------------------

const GLASS_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`

const GLASS_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uInk;
  uniform vec3 uShine;
  uniform float uOpacity;
  uniform float uInkWidth;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vec3 n = normalize(vNormalV);
    float facing = abs(dot(n, normalize(vViewDir)));
    float ink = 1.0 - smoothstep(uInkWidth - 0.05, uInkWidth, facing);
    float streak = gl_FrontFacing
      ? smoothstep(-0.78, -0.7, n.x) * (1.0 - smoothstep(-0.56, -0.48, n.x))
      : 0.0;
    vec3 color = mix(mix(uColor, uShine, streak), uInk, ink);
    float alpha = max(uOpacity + streak * 0.5, ink * 0.92);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

/** Clear plastic with an inked fresnel silhouette (toon style). */
export function toonGlassMaterial({
  color = '#FFFFFF',
  opacity = 0.14,
  inkWidth = 0.3,
  ink = INK,
}: { color?: string; opacity?: number; inkWidth?: number; ink?: string } = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uInk: { value: new THREE.Color(ink) },
      uShine: { value: new THREE.Color('#FFFFFF') },
      uOpacity: { value: opacity },
      uInkWidth: { value: inkWidth },
    },
    vertexShader: GLASS_VERTEX,
    fragmentShader: GLASS_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

// ---------------------------------------------------------------------------
// Tea
// ---------------------------------------------------------------------------

const LIQUID_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vLocal = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`

const LIQUID_FRAGMENT = /* glsl */ `
  uniform float uFill;
  uniform float uFoam;
  uniform float uOpacity;
  uniform vec3 uDeep;
  uniform vec3 uEdge;
  uniform vec3 uFoamColor;
  varying vec3 vLocal;
  varying vec3 vNormalV;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  void main() {
    if (vLocal.y > uFill) discard;
    vec3 n = normalize(vNormalV);
    float facing = abs(dot(n, normalize(vViewDir)));
    float theta = atan(vLocal.z, vLocal.x);

    // Cheese foam sits on the tea with a soft, wispy boundary where it bleeds in.
    float foamStart = uFill - uFoam;
    float wisp = 0.016 * sin(theta * 5.0 + 1.3) + 0.01 * sin(theta * 11.0 - 1.7);
    float foamMix = uFoam > 0.001 ? smoothstep(foamStart - 0.035, foamStart + 0.01, vLocal.y + wisp) : 0.0;

    // Thick tea in the middle of the cup reads deep, thin tea at the edge glows.
    #ifdef TOON
      float thick = facing > 0.45 ? 1.0 : 0.35;
    #else
      float thick = pow(facing, 0.75);
    #endif
    vec3 tea = mix(uEdge, uDeep, thick);
    float hn = clamp(vLocal.y / max(uFill, 0.001), 0.0, 1.0);
    tea *= 0.8 + 0.25 * hn;

    float lambert = max(dot(n, normalize(vec3(0.35, 0.55, 0.75))), 0.0);
    // Foam is a dense, opaque cream: shade it like a soft solid.
    vec3 foam = uFoamColor * (0.74 + 0.16 * lambert + 0.12 * facing);
    #ifndef TOON
      // Micro bubbles in the foam.
      foam *= 0.97 + 0.05 * hash(floor(vLocal * 140.0));
    #endif
    foam = mix(foam * vec3(0.9, 0.82, 0.74), foam, smoothstep(foamStart - 0.02, foamStart + 0.09, vLocal.y));

    #ifdef FRONT
      vec3 color = mix(tea, foam, foamMix);
      float alpha = mix(mix(uOpacity * 0.6, uOpacity, thick), 1.0, foamMix);
    #else
      vec3 color = mix(uDeep * 0.75, foam * 0.85, foamMix);
      float alpha = 1.0;
    #endif
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export interface LiquidMaterials {
  /** Far wall of the tea (opaque, writes depth). */
  back: THREE.ShaderMaterial
  /** Near wall (translucent) blended over the far wall and the straw. */
  front: THREE.ShaderMaterial
}

/** Two passes over one uniforms object, so fill/colour updates hit both. */
export function liquidMaterials(toon: boolean): LiquidMaterials {
  const uniforms = {
    uFill: { value: 1 },
    uFoam: { value: 0 },
    uOpacity: { value: toon ? 0.92 : 0.86 },
    uDeep: { value: new THREE.Color() },
    uEdge: { value: new THREE.Color() },
    uFoamColor: { value: new THREE.Color('#F8F2E6') },
  }
  const defines = toon ? { TOON: '' } : {}
  return {
    back: new THREE.ShaderMaterial({
      uniforms,
      defines,
      vertexShader: LIQUID_VERTEX,
      fragmentShader: LIQUID_FRAGMENT,
      side: THREE.BackSide,
    }),
    front: new THREE.ShaderMaterial({
      uniforms,
      defines: { ...defines, FRONT: '' },
      vertexShader: LIQUID_VERTEX,
      fragmentShader: LIQUID_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
  }
}

// ---------------------------------------------------------------------------
// Shadow
// ---------------------------------------------------------------------------

/** Soft contact + ambient blob shadow, grounding the cup without a shadow map. */
export function shadowMaterial(color: string, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float contact = 1.0 - smoothstep(0.28, 0.5, r);
        float ambient = 1.0 - smoothstep(0.3, 1.0, r);
        gl_FragColor = vec4(uColor, uOpacity * (0.55 * ambient + 0.45 * contact));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  })
}

// ---------------------------------------------------------------------------
// Material sets
// ---------------------------------------------------------------------------

export interface CupMaterials {
  toon: boolean
  shadow: THREE.ShaderMaterial
  glass: THREE.Material
  bowl: THREE.Material
  flatGlass: THREE.Material
  sleeve: THREE.Material
  rim: THREE.Material
  liquid: THREE.ShaderMaterial
  liquidFront: THREE.ShaderMaterial
  /** Tea surface, or the top of the cheese foam. */
  cap: THREE.MeshToonMaterial | THREE.MeshPhysicalMaterial
  ice: THREE.Material
  bubble: THREE.Material
  chip: THREE.MeshToonMaterial | THREE.MeshStandardMaterial
  sauce: THREE.MeshToonMaterial | THREE.MeshPhysicalMaterial
  bits: THREE.MeshToonMaterial | THREE.MeshPhysicalMaterial
  straw: THREE.Material
  textures: THREE.Texture[]
}

/** Creates one material set per canvas; colours are updated in place on flavor/drink change. */
export function makeMaterials(style: CupStyle): CupMaterials {
  const chipTextures = createChipTextures()
  const grain = createGrainBump(26, 5)

  if (style === 'toon') {
    const liquid = liquidMaterials(true)
    return {
      toon: true,
      shadow: shadowMaterial(INK, 0.22),
      glass: toonGlassMaterial({ opacity: 0.14, inkWidth: 0.3 }),
      bowl: toonGlassMaterial({ opacity: 0.16, inkWidth: 0.26 }),
      flatGlass: toonGlassMaterial({ opacity: 0.12, inkWidth: 0 }),
      sleeve: toonGlassMaterial({ opacity: 0.12, inkWidth: 0.4 }),
      rim: new THREE.MeshBasicMaterial({ color: INK }),
      liquid: liquid.back,
      liquidFront: liquid.front,
      cap: toonMaterial('#FBF4E3', { transparent: true }),
      ice: toonGlassMaterial({ color: '#F4FBFF', opacity: 0.5, inkWidth: 0.22, ink: '#B9D6E2' }),
      bubble: new THREE.MeshBasicMaterial({ color: '#FFF6DA', transparent: true, opacity: 0.85 }),
      chip: toonMaterial('#FFFFFF', { map: chipTextures.map, vertexColors: true }),
      sauce: toonMaterial(SAUCE_VARIANTS.bolo.color, { vertexColors: true }),
      bits: toonMaterial('#FFFFFF', { vertexColors: true }),
      straw: toonMaterial('#CFE3EE', { side: THREE.DoubleSide }),
      textures: [chipTextures.map, chipTextures.bump, grain],
    }
  }

  const liquid = liquidMaterials(false)
  return {
    toon: false,
    shadow: shadowMaterial('#4A2C1A', 0.34),
    glass: clearPlastic(),
    bowl: clearPlastic({ bodyTint: '#F7FAFC', baseAlpha: 0.04, edgeAlpha: 0.7 }),
    flatGlass: clearPlastic({ baseAlpha: 0.05, edgeAlpha: 0.15 }),
    sleeve: clearPlastic({ baseAlpha: 0.04, edgeAlpha: 0.35 }),
    // Rolled rim lip: thicker plastic, so it reads brighter than the wall.
    rim: clearPlastic({ bodyTint: '#FFFFFF', edgeTint: '#C8D3DA', baseAlpha: 0.28, edgeAlpha: 0.5 }),
    liquid: liquid.back,
    liquidFront: liquid.front,
    cap: new THREE.MeshPhysicalMaterial({
      color: DRINK_VARIANTS['tea-cloudy'].surface,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      bumpMap: grain,
      bumpScale: 0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
    // Ice inside tea: lighter where it displaces the tea, bright refracting edges.
    ice: clearPlastic({
      bodyTint: '#F2C48C',
      edgeTint: '#FFFFFF',
      baseAlpha: 0.2,
      edgeAlpha: 0.42,
      reflAlpha: 0.55,
      roughness: 0.16,
      envMapIntensity: 2.2,
      side: THREE.FrontSide,
    }),
    bubble: clearPlastic({
      bodyTint: '#FFF7E6',
      edgeTint: '#FFFFFF',
      baseAlpha: 0.12,
      edgeAlpha: 0.85,
      reflAlpha: 1,
      side: THREE.FrontSide,
    }),
    chip: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: chipTextures.map,
      bumpMap: chipTextures.bump,
      bumpScale: 1.6,
      vertexColors: true,
      emissive: new THREE.Color('#B86A14'),
      emissiveIntensity: 0.24,
      roughness: 0.56,
      metalness: 0,
      envMapIntensity: 0.35,
    }),
    sauce: new THREE.MeshPhysicalMaterial({
      color: SAUCE_VARIANTS.bolo.color,
      vertexColors: true,
      roughness: SAUCE_VARIANTS.bolo.roughness,
      clearcoat: SAUCE_VARIANTS.bolo.clearcoat,
      clearcoatRoughness: 0.38,
      specularIntensity: 0.35,
      specularColor: new THREE.Color('#FFBE78'),
      bumpMap: grain,
      bumpScale: 0.45,
      envMapIntensity: 0.15,
    }),
    bits: new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      vertexColors: true,
      roughness: 0.48,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      specularIntensity: 0.35,
      specularColor: new THREE.Color('#FFD29E'),
      envMapIntensity: 0.2,
    }),
    straw: new THREE.MeshPhysicalMaterial({
      color: '#E7EEF2',
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
    }),
    textures: [chipTextures.map, chipTextures.bump, grain],
  }
}

export function applyFlavor(materials: CupMaterials, flavor: FlavorKey): void {
  const variant = SAUCE_VARIANTS[flavor]
  materials.sauce.color.set(variant.color)
  if (materials.sauce instanceof THREE.MeshPhysicalMaterial) {
    materials.sauce.roughness = variant.roughness
    materials.sauce.clearcoat = variant.clearcoat
  }
}

export function applyDrink(materials: CupMaterials, drink: DrinkKey): void {
  const variant = DRINK_VARIANTS[drink]
  const uniforms = materials.liquid.uniforms
  ;(uniforms.uDeep.value as THREE.Color).set(variant.deep)
  ;(uniforms.uEdge.value as THREE.Color).set(variant.edge)
  ;(uniforms.uFoamColor.value as THREE.Color).set(variant.foamColor)
  const foam = variant.foam > 0
  const cap = materials.cap
  cap.color.set(foam ? variant.foamColor : variant.surface)
  cap.opacity = foam ? 1 : materials.toon ? 0.95 : 0.8
  if (cap instanceof THREE.MeshPhysicalMaterial) {
    // Foam is matte and bubbly; tea is a glossy mirror.
    cap.roughness = foam ? 0.85 : 0.06
    cap.clearcoat = foam ? 0 : 1
    cap.bumpScale = foam ? 1.2 : 0
  }
  // Ice looks like lighter tea where it displaces the liquid.
  const ice = materials.ice.userData.plastic as { uBodyTint: { value: THREE.Color } } | undefined
  ice?.uBodyTint.value.set(variant.edge).lerp(new THREE.Color('#FFFFFF'), 0.45)
}

export function disposeMaterials(materials: CupMaterials): void {
  for (const value of Object.values(materials)) {
    if (value instanceof THREE.Material) value.dispose()
  }
  materials.textures.forEach((texture) => texture.dispose())
}
