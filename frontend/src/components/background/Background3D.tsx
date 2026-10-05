import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import * as THREE from 'three'
import { useIsCompact, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useResolvedTheme, type ResolvedTheme } from '../../hooks/useTheme'
import { pointer } from '../../lib/pointer'
import { HOME_PATH } from '../../lib/routes'
import { duration, zIndex } from '../../theme'

const CANVAS_INSET = 0
const CAMERA_FOV = 42
const CAMERA_NEAR = 0.1
const CAMERA_FAR = 40
const CAMERA_Z = 7.4
const MAX_DPR = 1.75
const MIN_DPR = 1
const DESKTOP_BLOB_DETAIL = 6
const COMPACT_BLOB_DETAIL = 5
const DESKTOP_DUST_COUNT = 1050
const COMPACT_DUST_COUNT = 560
const DUST_SPREAD_X = 11
const DUST_SPREAD_Y = 8
const DUST_DEPTH = 9
const DUST_NEAR_Z = 2
const DUST_POINT_SIZE = 7
const DUST_DRIFT_RATE = 0.025
const DUST_PARALLAX = 0.36
const CAMERA_PARALLAX_X = 0.18
const CAMERA_PARALLAX_Y = 0.12
const CAMERA_DAMPING = 3.2
const HERO_DAMPING = 4.8
const ROUTE_DAMPING = 3.8
const ROUTE_SCALE = 0.55
const HERO_SCALE = 1.42
const COMPACT_HERO_SCALE = 1.05
const HERO_DESKTOP_X_FACTOR = 0.24
const HERO_DESKTOP_Y_FACTOR = -0.01
const HERO_COMPACT_X_FACTOR = 0.02
const HERO_COMPACT_Y_FACTOR = -0.38
const INNER_PAGE_X_FACTOR = 0.31
const INNER_PAGE_Y_FACTOR = 0.28
const SCROLL_WORLD_RATE = 0.00065
const SCROLL_ROTATION_RATE = 0.00022
const MAX_SCROLL_SHIFT = 1.4
const POINTER_LEAN_X = 0.18
const POINTER_LEAN_Y = 0.26
const POINTER_TURN_X = 0.12
const BASE_NOISE_AMPLITUDE = 0.13
const POINTER_NOISE_BOOST = 0.09
const MAX_POINTER_SPEED = 2.5
const POINTER_SPEED_DAMPING = 4.2
const MIN_FRAME_DELTA = 1 / 240
const BLOB_ROTATION_RATE_X = 0.045
const BLOB_ROTATION_RATE_Y = 0.075
const ROUTE_BRIGHTNESS = 0.58
const HOME_BRIGHTNESS = 1
const DARK_BLOB_OPACITY = 0.9
const LIGHT_BLOB_OPACITY = 0.82
const COMPACT_BLOB_OPACITY_FACTOR = 0.8
const DARK_DUST_OPACITY = 0.34
const LIGHT_DUST_OPACITY = 0.2
const FALLBACK_BLUR = 60
const FALLBACK_TRANSITION_SECONDS = duration.slow * 2
const FULL_PERCENT = '100%'
const FALLBACK_PRIMARY_SIZE = '54vmin'
const FALLBACK_SECONDARY_SIZE = '42vmin'
const FALLBACK_HERO_RIGHT = '-4vmin'
const FALLBACK_HERO_BOTTOM = '3vmin'
const FALLBACK_COMPACT_RIGHT = '20vw'
const FALLBACK_COMPACT_BOTTOM = '-5vmin'
const FALLBACK_INNER_RIGHT = '-8vmin'
const FALLBACK_INNER_BOTTOM = '54vh'
const FALLBACK_SECONDARY_LEFT = '-10vmin'
const FALLBACK_SECONDARY_TOP = '48vh'
const FALLBACK_HOME_OPACITY = 0.72
const FALLBACK_INNER_OPACITY = 0.34
const SATELLITE_COUNT = 4
// Orbits are tall ellipses so the satellites stay around the blob, clear of the hero text.
const SATELLITE_ORBIT_X = 0.62
const SATELLITE_ORBIT_Y = 0.82
const TAU = Math.PI * 2

const DEFAULT_PALETTE = {
  a: '#7c5cff',
  b: '#ff5fa2',
  c: '#2fd6c4',
  fog: '#07080d',
}

type Palette = typeof DEFAULT_PALETTE

type SceneProps = {
  compact: boolean
  isHome: boolean
  palette: Palette
  reducedMotion: boolean
  theme: ResolvedTheme
}

const blobVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vNoise;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m *= m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float surfaceNoise(vec3 direction) {
    float broad = snoise(direction * 1.15 + vec3(uTime * 0.11, -uTime * 0.08, uTime * 0.06));
    float detail = snoise(direction * 2.3 - vec3(uTime * 0.07, uTime * 0.05, 0.0));
    return broad * 0.84 + detail * 0.16;
  }

  vec3 displacedPoint(vec3 point) {
    vec3 direction = normalize(point);
    return direction * (1.0 + surfaceNoise(direction) * uAmplitude);
  }

  void main() {
    const float NORMAL_STEP = 0.012;
    vec3 direction = normalize(position);
    vec3 tangent = normalize(cross(direction, abs(direction.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = normalize(cross(direction, tangent));
    vec3 displaced = displacedPoint(position);
    vec3 displacedTangent = displacedPoint(normalize(direction + tangent * NORMAL_STEP));
    vec3 displacedBitangent = displacedPoint(normalize(direction + bitangent * NORMAL_STEP));
    vec3 objectNormal = normalize(cross(displacedTangent - displaced, displacedBitangent - displaced));
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
    vNoise = surfaceNoise(direction);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const blobFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uFogColor;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uIsLight;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vNoise;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(vec3(-0.45, 0.7, 0.8));
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.7);
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 42.0);
    float bands = 0.5 + 0.5 * sin(vNoise * 6.0 + fresnel * 5.0 + uTime * 0.22);
    vec3 base = mix(uColorA, uColorB, 0.32 + bands * 0.34);
    base = mix(base, uColorC, 0.1 + smoothstep(0.3, 0.95, fresnel + vNoise * 0.12) * 0.42);
    vec3 shifted = mix(uColorC, uColorB, bands);
    base = mix(base, shifted, fresnel * 0.2);
    float porcelain = mix(0.3, 0.42, uIsLight);
    vec3 color = base * (porcelain + diffuse * 0.55);
    color += uColorC * fresnel * mix(0.62, 0.24, uIsLight);
    color += mix(vec3(1.0), uColorA, uIsLight * 0.4) * specular * mix(0.62, 0.24, uIsLight);
    color = mix(uFogColor, color, mix(0.92, 0.82, uIsLight));
    gl_FragColor = vec4(color * uBrightness, uOpacity * uBrightness);
  }
`

const dustVertexShader = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uPointSize;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize * uPixelRatio * (5.0 / max(2.0, -viewPosition.z));
  }
`

const dustFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorC;
  uniform float uOpacity;
  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float distanceToCenter = length(centered);
    float alpha = smoothstep(0.5, 0.06, distanceToCenter) * uOpacity;
    if (alpha < 0.01) discard;
    vec3 color = mix(uColorA, uColorC, gl_PointCoord.y);
    gl_FragColor = vec4(color, alpha);
  }
`

const SATELLITES = [
  { radius: 2.05, speed: 0.13, phase: 0.2, depth: -0.45, scale: 0.18, kind: 'torus' },
  { radius: 2.45, speed: -0.09, phase: 1.8, depth: -1.4, scale: 0.22, kind: 'octahedron' },
  { radius: 1.82, speed: 0.1, phase: 3.4, depth: 0.55, scale: 0.17, kind: 'capsule' },
  { radius: 2.7, speed: -0.065, phase: 4.9, depth: -2.1, scale: 0.14, kind: 'sphere' },
] as const

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  return {
    a: read('--scene-a', DEFAULT_PALETTE.a),
    b: read('--scene-b', DEFAULT_PALETTE.b),
    c: read('--scene-c', DEFAULT_PALETTE.c),
    fog: read('--scene-fog', DEFAULT_PALETTE.fog),
  }
}

function hasWebGLSupport(): boolean {
  try {
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl2') ?? probe.getContext('webgl')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return context !== null
  } catch {
    return false
  }
}

function seededRandom(seed: number): () => number {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

// Renders the static CSS substitute when WebGL cannot be used.
function CssFallback({ compact, isHome, reducedMotion }: Pick<SceneProps, 'compact' | 'isHome' | 'reducedMotion'>) {
  const right = isHome
    ? compact
      ? FALLBACK_COMPACT_RIGHT
      : FALLBACK_HERO_RIGHT
    : FALLBACK_INNER_RIGHT
  const bottom = isHome
    ? compact
      ? FALLBACK_COMPACT_BOTTOM
      : FALLBACK_HERO_BOTTOM
    : FALLBACK_INNER_BOTTOM
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: CANVAS_INSET,
        zIndex: zIndex.scene,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: FALLBACK_PRIMARY_SIZE,
          height: FALLBACK_PRIMARY_SIZE,
          right,
          bottom,
          borderRadius: FULL_PERCENT,
          opacity: isHome ? FALLBACK_HOME_OPACITY : FALLBACK_INNER_OPACITY,
          filter: `blur(${FALLBACK_BLUR}px)`,
          background: 'radial-gradient(circle at 35% 30%, var(--scene-b), var(--scene-a) 48%, transparent 72%)',
          transition: reducedMotion
            ? undefined
            : `right ${FALLBACK_TRANSITION_SECONDS}s ease, bottom ${FALLBACK_TRANSITION_SECONDS}s ease, opacity ${FALLBACK_TRANSITION_SECONDS}s ease`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: FALLBACK_SECONDARY_SIZE,
          height: FALLBACK_SECONDARY_SIZE,
          left: FALLBACK_SECONDARY_LEFT,
          top: FALLBACK_SECONDARY_TOP,
          borderRadius: FULL_PERCENT,
          opacity: FALLBACK_INNER_OPACITY,
          filter: `blur(${FALLBACK_BLUR}px)`,
          background: 'radial-gradient(circle, var(--scene-c), transparent 68%)',
        }}
      />
    </div>
  )
}

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError: () => void
}

type ErrorBoundaryState = { failed: boolean }

// Converts renderer creation failures into the CSS scene.
class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

// Draws the displaced pearl and applies heavy pointer response.
function HeroBlob({ compact, isHome, palette, reducedMotion, theme }: SceneProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.ShaderMaterial>(null)
  const previousPointer = useRef(new THREE.Vector2())
  const filteredSpeed = useRef(0)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: BASE_NOISE_AMPLITUDE },
      uBrightness: { value: HOME_BRIGHTNESS },
      uOpacity: {
        value:
          (theme === 'dark' ? DARK_BLOB_OPACITY : LIGHT_BLOB_OPACITY) *
          (compact ? COMPACT_BLOB_OPACITY_FACTOR : 1),
      },
      uIsLight: { value: theme === 'light' ? 1 : 0 },
      uColorA: { value: new THREE.Color(palette.a) },
      uColorB: { value: new THREE.Color(palette.b) },
      uColorC: { value: new THREE.Color(palette.c) },
      uFogColor: { value: new THREE.Color(palette.fog) },
    }),
    [compact, palette.a, palette.b, palette.c, palette.fog, theme],
  )

  useFrame((state, delta) => {
    if (!mesh.current || !material.current) return
    const time = state.clock.elapsedTime
    const targetX = reducedMotion || !pointer.active ? 0 : pointer.x
    const targetY = reducedMotion || !pointer.active ? 0 : pointer.y
    const safeDelta = Math.max(delta, MIN_FRAME_DELTA)
    const pointerDistance = Math.hypot(
      targetX - previousPointer.current.x,
      targetY - previousPointer.current.y,
    )
    const pointerSpeed = Math.min(pointerDistance / safeDelta, MAX_POINTER_SPEED)
    filteredSpeed.current = THREE.MathUtils.damp(
      filteredSpeed.current,
      reducedMotion ? 0 : pointerSpeed,
      POINTER_SPEED_DAMPING,
      delta,
    )
    previousPointer.current.set(targetX, targetY)
    const scroll = typeof window === 'undefined' ? 0 : window.scrollY
    const rotationX = targetY * POINTER_LEAN_X + scroll * SCROLL_ROTATION_RATE
    const rotationY = targetX * POINTER_LEAN_Y
    mesh.current.rotation.x = THREE.MathUtils.damp(mesh.current.rotation.x, rotationX, HERO_DAMPING, delta)
    mesh.current.rotation.y = THREE.MathUtils.damp(
      mesh.current.rotation.y,
      rotationY + time * BLOB_ROTATION_RATE_Y,
      HERO_DAMPING,
      delta,
    )
    mesh.current.rotation.z = THREE.MathUtils.damp(
      mesh.current.rotation.z,
      targetX * POINTER_TURN_X + time * BLOB_ROTATION_RATE_X,
      HERO_DAMPING,
      delta,
    )
    material.current.uniforms.uTime.value = reducedMotion ? 0 : time
    material.current.uniforms.uAmplitude.value = THREE.MathUtils.damp(
      material.current.uniforms.uAmplitude.value,
      BASE_NOISE_AMPLITUDE + filteredSpeed.current * POINTER_NOISE_BOOST,
      HERO_DAMPING,
      delta,
    )
    const targetBrightness = isHome ? HOME_BRIGHTNESS : ROUTE_BRIGHTNESS
    material.current.uniforms.uBrightness.value = reducedMotion
      ? targetBrightness
      : THREE.MathUtils.damp(
          material.current.uniforms.uBrightness.value,
          targetBrightness,
          ROUTE_DAMPING,
          delta,
        )
  })

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1, compact ? COMPACT_BLOB_DETAIL : DESKTOP_BLOB_DETAIL]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={blobVertexShader}
        fragmentShader={blobFragmentShader}
        transparent
        depthWrite
      />
    </mesh>
  )
}

// Adds small orbiting solids that establish depth around the hero.
function Satellites({ palette, reducedMotion, theme }: Omit<SceneProps, 'compact'>) {
  const group = useRef<THREE.Group>(null)
  const satellites = useRef<Array<THREE.Mesh | null>>([])

  useFrame((state) => {
    if (!group.current) return
    const time = reducedMotion ? 0 : state.clock.elapsedTime
    SATELLITES.forEach((satellite, index) => {
      const mesh = satellites.current[index]
      if (!mesh) return
      const angle = satellite.phase + time * satellite.speed * TAU
      mesh.position.set(
        Math.cos(angle) * satellite.radius * SATELLITE_ORBIT_X,
        Math.sin(angle) * satellite.radius * SATELLITE_ORBIT_Y,
        satellite.depth + Math.sin(angle) * 0.42,
      )
      mesh.rotation.x = angle * 0.7
      mesh.rotation.y = angle
    })
  })

  return (
    <group ref={group}>
      {SATELLITES.map((satellite, index) => (
        <mesh
          key={satellite.kind}
          ref={(node) => {
            satellites.current[index] = node
          }}
          scale={satellite.scale}
        >
          {satellite.kind === 'torus' && <torusGeometry args={[1, 0.34, 14, 44]} />}
          {satellite.kind === 'octahedron' && <octahedronGeometry args={[1, 1]} />}
          {satellite.kind === 'capsule' && <capsuleGeometry args={[0.62, 1, 8, 16]} />}
          {satellite.kind === 'sphere' && <sphereGeometry args={[1, 24, 18]} />}
          <meshStandardMaterial
            color={index % SATELLITE_COUNT === 0 ? palette.b : index % 2 === 0 ? palette.c : palette.a}
            emissive={theme === 'dark' ? palette.a : palette.fog}
            emissiveIntensity={theme === 'dark' ? 0.16 : 0.025}
            metalness={theme === 'dark' ? 0.32 : 0.08}
            roughness={theme === 'dark' ? 0.28 : 0.52}
          />
        </mesh>
      ))}
    </group>
  )
}

// Renders deterministic soft particles with deeper pointer parallax.
function Dust({ compact, palette, reducedMotion, theme }: Pick<SceneProps, 'compact' | 'palette' | 'reducedMotion' | 'theme'>) {
  const points = useRef<THREE.Points>(null)
  const count = compact ? COMPACT_DUST_COUNT : DESKTOP_DUST_COUNT
  const positions = useMemo(() => {
    const random = seededRandom(71237)
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3
      values[offset] = (random() - 0.5) * DUST_SPREAD_X
      values[offset + 1] = (random() - 0.5) * DUST_SPREAD_Y
      values[offset + 2] = DUST_NEAR_Z - random() * DUST_DEPTH
    }
    return values
  }, [count])
  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: Math.min(Math.max(window.devicePixelRatio, MIN_DPR), MAX_DPR) },
      uPointSize: { value: DUST_POINT_SIZE },
      uOpacity: { value: theme === 'dark' ? DARK_DUST_OPACITY : LIGHT_DUST_OPACITY },
      uColorA: { value: new THREE.Color(palette.a) },
      uColorC: { value: new THREE.Color(palette.c) },
    }),
    [palette.a, palette.c, theme],
  )

  useFrame((state, delta) => {
    if (!points.current) return
    const targetX = reducedMotion || !pointer.active ? 0 : pointer.x * DUST_PARALLAX
    const targetY = reducedMotion || !pointer.active ? 0 : -pointer.y * DUST_PARALLAX
    points.current.position.x = THREE.MathUtils.damp(points.current.position.x, targetX, CAMERA_DAMPING, delta)
    points.current.position.y = THREE.MathUtils.damp(points.current.position.y, targetY, CAMERA_DAMPING, delta)
    points.current.rotation.z = reducedMotion ? 0 : state.clock.elapsedTime * DUST_DRIFT_RATE
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        transparent
        depthWrite={false}
        blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  )
}

// Positions the scene for each route and controls camera parallax.
function Scene({ compact, isHome, palette, reducedMotion, theme }: SceneProps) {
  const heroGroup = useRef<THREE.Group>(null)
  const { invalidate, viewport } = useThree()

  useEffect(() => {
    invalidate()
  }, [invalidate, isHome, palette, theme])

  useFrame((state, delta) => {
    if (!heroGroup.current) return
    const pointerX = reducedMotion || !pointer.active ? 0 : pointer.x
    const pointerY = reducedMotion || !pointer.active ? 0 : pointer.y
    const homeX = viewport.width * (compact ? HERO_COMPACT_X_FACTOR : HERO_DESKTOP_X_FACTOR)
    const homeY = viewport.height * (compact ? HERO_COMPACT_Y_FACTOR : HERO_DESKTOP_Y_FACTOR)
    const routeX = viewport.width * INNER_PAGE_X_FACTOR
    const routeY = viewport.height * INNER_PAGE_Y_FACTOR
    const scroll = typeof window === 'undefined' ? 0 : window.scrollY
    const scrollShift = Math.min(scroll * SCROLL_WORLD_RATE, MAX_SCROLL_SHIFT)
    const targetX = isHome ? homeX : routeX
    const targetY = (isHome ? homeY : routeY) + scrollShift
    const targetScale = (compact ? COMPACT_HERO_SCALE : HERO_SCALE) * (isHome ? 1 : ROUTE_SCALE)
    heroGroup.current.position.x = reducedMotion
      ? targetX
      : THREE.MathUtils.damp(heroGroup.current.position.x, targetX, ROUTE_DAMPING, delta)
    heroGroup.current.position.y = reducedMotion
      ? targetY
      : THREE.MathUtils.damp(heroGroup.current.position.y, targetY, ROUTE_DAMPING, delta)
    const scale = reducedMotion
      ? targetScale
      : THREE.MathUtils.damp(heroGroup.current.scale.x, targetScale, ROUTE_DAMPING, delta)
    heroGroup.current.scale.setScalar(scale)
    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      -pointerX * CAMERA_PARALLAX_X,
      CAMERA_DAMPING,
      delta,
    )
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      pointerY * CAMERA_PARALLAX_Y,
      CAMERA_DAMPING,
      delta,
    )
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <hemisphereLight args={[palette.c, palette.fog, theme === 'dark' ? 0.9 : 1.35]} />
      <directionalLight position={[-3, 4, 5]} color={palette.b} intensity={theme === 'dark' ? 1.8 : 1.15} />
      <group ref={heroGroup}>
        <HeroBlob
          compact={compact}
          isHome={isHome}
          palette={palette}
          reducedMotion={reducedMotion}
          theme={theme}
        />
        <Satellites
          isHome={isHome}
          palette={palette}
          reducedMotion={reducedMotion}
          theme={theme}
        />
      </group>
      <Dust compact={compact} palette={palette} reducedMotion={reducedMotion} theme={theme} />
    </>
  )
}

// Provides the full-viewport WebGL scene with accessibility and failure fallbacks.
export default function Background3D() {
  const location = useLocation()
  const compact = useIsCompact()
  const reducedMotion = usePrefersReducedMotion()
  const theme = useResolvedTheme()
  const isHome = location.pathname === HOME_PATH
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE)
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [webGLAvailable, setWebGLAvailable] = useState(hasWebGLSupport)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPalette(readPalette()))
    return () => cancelAnimationFrame(frame)
  }, [theme])

  useEffect(() => {
    const onVisibilityChange = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const fallback = <CssFallback compact={compact} isHome={isHome} reducedMotion={reducedMotion} />
  if (!webGLAvailable) return fallback

  const dpr = Math.min(Math.max(window.devicePixelRatio, MIN_DPR), MAX_DPR)
  const frameloop = visible ? (reducedMotion ? 'demand' : 'always') : 'never'

  return (
    <WebGLErrorBoundary fallback={fallback} onError={() => setWebGLAvailable(false)}>
      <Canvas
        aria-hidden="true"
        dpr={dpr}
        frameloop={frameloop}
        camera={{ fov: CAMERA_FOV, near: CAMERA_NEAR, far: CAMERA_FAR, position: [0, 0, CAMERA_Z] }}
        fallback={fallback}
        gl={{ alpha: true, antialias: !compact, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{
          position: 'fixed',
          inset: CANVAS_INSET,
          width: FULL_PERCENT,
          height: FULL_PERCENT,
          zIndex: zIndex.scene,
          pointerEvents: 'none',
          background: 'transparent',
        }}
      >
        <Scene
          compact={compact}
          isHome={isHome}
          palette={palette}
          reducedMotion={reducedMotion}
          theme={theme}
        />
      </Canvas>
    </WebGLErrorBoundary>
  )
}
