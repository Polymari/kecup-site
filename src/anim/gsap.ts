import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { Draggable } from 'gsap/Draggable'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { Flip } from 'gsap/Flip'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(
  ScrollTrigger,
  SplitText,
  DrawSVGPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  Draggable,
  InertiaPlugin,
  Flip,
  CustomEase,
)

export {
  CustomEase,
  Draggable,
  DrawSVGPlugin,
  Flip,
  gsap,
  InertiaPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  ScrollTrigger,
  SplitText,
}
