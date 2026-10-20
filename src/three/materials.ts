import * as THREE from 'three'
import { createToonGradientMap } from './gradientMap'
import { DRINK_VARIANTS, SAUCE_VARIANTS } from './geometry'
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
    // Inked silhouette: a crisp band where the surface turns away from the eye.
    float ink = 1.0 - smoothstep(uInkWidth - 0.05, uInkWidth, facing);
    // Cartoon gloss streak on the front-left of the glass.
    float streak = gl_FrontFacing
      ? smoothstep(-0.78, -0.7, n.x) * (1.0 - smoothstep(-0.56, -0.48, n.x))
      : 0.0;
    vec3 color = mix(mix(uColor, uShine, streak), uInk, ink);
    float alpha = max(uOpacity + streak * 0.5, ink * 0.92);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

/** Clear plastic with an inked fresnel silhouette — outlines without an opaque hull. */
export function toonGlassMaterial({
  color = '#FFFFFF',
  opacity = 0.14,
  inkWidth = 0.3,
}: { color?: string; opacity?: number; inkWidth?: number } = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uInk: { value: new THREE.Color(INK) },
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
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uStops;
  uniform float uToon;
  varying vec3 vLocal;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    if (vLocal.y > uFill) discard;
    float theta = atan(vLocal.z, vLocal.x);
    float h = vLocal.y / max(uFill, 0.001);
    // Wavy layer boundaries, like the poured layers in the logo.
    float w = 0.035 * sin(theta * 3.0 + 1.3) + 0.018 * sin(theta * 5.0 - 0.4);
    vec3 color = uC0;
    color = mix(color, uC1, step(uStops.x + w, h));
    color = mix(color, uC2, step(uStops.y - w * 0.8, h));
    color = mix(color, uC3, step(uStops.z + w * 0.6, h));

    vec3 n = normalize(vNormalV);
    float d = dot(n, normalize(vec3(0.45, 0.75, 0.5)));
    float facing = abs(dot(n, normalize(vViewDir)));
    float shade = uToon > 0.5 ? (d > 0.1 ? 1.0 : 0.86) : 0.8 + 0.2 * max(d, 0.0);
    float edge = uToon > 0.5 ? 1.0 - smoothstep(0.2, 0.3, facing) : 0.0;
    color *= shade;
    color = mix(color, color * 0.74, edge);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

/** Layered tea: bands follow the fill height, everything above it is discarded. */
export function liquidMaterial(toon: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFill: { value: 1 },
      uC0: { value: new THREE.Color() },
      uC1: { value: new THREE.Color() },
      uC2: { value: new THREE.Color() },
      uC3: { value: new THREE.Color() },
      uStops: { value: new THREE.Vector3(0.3, 0.6, 0.85) },
      uToon: { value: toon ? 1 : 0 },
    },
    vertexShader: LIQUID_VERTEX,
    fragmentShader: LIQUID_FRAGMENT,
  })
}

export interface CupMaterials {
  toon: boolean
  shadow: THREE.ShaderMaterial
  glass: THREE.Material
  bowl: THREE.Material
  flatGlass: THREE.Material
  sleeve: THREE.Material
  rim: THREE.Material
  liquid: THREE.ShaderMaterial
  cap: THREE.MeshToonMaterial | THREE.MeshStandardMaterial
  ice: THREE.Material
  bubble: THREE.Material
  chip: THREE.Material
  sauce: THREE.MeshToonMaterial | THREE.MeshPhysicalMaterial
  bits: THREE.MeshToonMaterial | THREE.MeshStandardMaterial
  straw: THREE.Material
}

/**
 * Ice and bubbles sit inside opaque tea. They render in the opaque pass right
 * after the tea (renderOrder in KeCupModel) with depth testing off, so they
 * show "through" the tea like the logo, while chips/straw drawn later and the
 * glass on top still layer correctly.
 */
function overlay<T extends THREE.Material>(material: T): T {
  material.depthTest = false
  material.depthWrite = false
  material.transparent = false
  return material
}

/**
 * Clear plastic for the realistic style. Transmission can't "see" the CSS page
 * behind a transparent canvas (it rendered as a milky haze) and costs an extra
 * scene pass, so use a thin, glossy, alpha-blended shell lit by the env map.
 */
function realisticGlass(color: string, opacity = 0.2): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 1,
    envMapIntensity: 1.3,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

/** Soft radial blob shadow — grounds the cup without a shadow-map pass. */
export function shadowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(INK) }, uOpacity: { value: 0.22 } },
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
        gl_FragColor = vec4(uColor, uOpacity * (1.0 - smoothstep(0.35, 1.0, r)));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  })
}

/** Creates one material set per canvas; colours are recoloured in place on flavor/drink change. */
export function makeMaterials(style: CupStyle): CupMaterials {
  if (style === 'toon') {
    return {
      toon: true,
      shadow: shadowMaterial(),
      glass: toonGlassMaterial({ opacity: 0.14, inkWidth: 0.3 }),
      bowl: toonGlassMaterial({ opacity: 0.16, inkWidth: 0.26 }),
      // Base discs are seen almost edge-on; inking them paints a heavy band.
      flatGlass: toonGlassMaterial({ opacity: 0.12, inkWidth: 0 }),
      sleeve: toonGlassMaterial({ opacity: 0.12, inkWidth: 0.4 }),
      rim: new THREE.MeshBasicMaterial({ color: INK }),
      liquid: liquidMaterial(true),
      cap: toonMaterial('#FBF4E3'),
      ice: overlay(toonMaterial('#DDF1FB')),
      bubble: overlay(new THREE.MeshBasicMaterial({ color: '#FFF4D0' })),
      chip: toonMaterial('#FFFFFF'),
      sauce: toonMaterial(SAUCE_VARIANTS.bolo.color),
      bits: toonMaterial(SAUCE_VARIANTS.bolo.bits),
      straw: toonMaterial('#CFE3EE'),
    }
  }

  return {
    toon: false,
    shadow: shadowMaterial(),
    glass: realisticGlass('#ffffff'),
    bowl: realisticGlass('#fffaf0'),
    flatGlass: realisticGlass('#ffffff', 0.12),
    sleeve: realisticGlass('#ffffff'),
    rim: new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.55,
      roughness: 0.15,
      clearcoat: 1,
    }),
    liquid: liquidMaterial(false),
    cap: new THREE.MeshStandardMaterial({ color: '#FBF4E3', roughness: 0.6 }),
    ice: overlay(new THREE.MeshPhysicalMaterial({ color: '#E8F6FF', roughness: 0.05, clearcoat: 1 })),
    bubble: overlay(new THREE.MeshStandardMaterial({ color: '#FFF7DC', roughness: 0.1 })),
    chip: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.8 }),
    sauce: new THREE.MeshPhysicalMaterial({
      color: SAUCE_VARIANTS.bolo.color,
      roughness: 0.4,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    }),
    bits: new THREE.MeshStandardMaterial({ color: SAUCE_VARIANTS.bolo.bits, roughness: 0.7 }),
    straw: new THREE.MeshPhysicalMaterial({
      color: '#CFE3EE',
      roughness: 0.2,
      clearcoat: 1,
      transparent: true,
      opacity: 0.85,
    }),
  }
}

export function applyFlavor(materials: CupMaterials, flavor: FlavorKey): void {
  materials.sauce.color.set(SAUCE_VARIANTS[flavor].color)
  materials.bits.color.set(SAUCE_VARIANTS[flavor].bits)
}

export function applyDrink(materials: CupMaterials, drink: DrinkKey): void {
  const variant = DRINK_VARIANTS[drink]
  const uniforms = materials.liquid.uniforms
  variant.layers.forEach((color, index) => {
    ;(uniforms[`uC${index}`].value as THREE.Color).set(color)
  })
  ;(uniforms.uStops.value as THREE.Vector3).set(...variant.stops)
  materials.cap.color.set(variant.cap)
}

export function disposeMaterials(materials: CupMaterials): void {
  for (const value of Object.values(materials)) {
    if (value instanceof THREE.Material) value.dispose()
  }
}
