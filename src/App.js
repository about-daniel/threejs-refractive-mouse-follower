import * as THREE from 'three'
import React, { useState, useRef, Suspense, useCallback } from 'react'
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber'
import { RoundedBoxBufferGeometry } from 'three/examples/jsm/geometries/RoundedBoxBufferGeometry'
import niceColors from 'nice-color-palettes/1000'
import perlin3 from './perlin'
import lerp from 'lerp'
import Light from './Light'
extend({ RoundedBoxBufferGeometry })

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const p3 = (time) => (a, b, c) => perlin3(a / NUM + time, b / NUM + time, c / NUM + time)
const NUM = isMobile ? 10 : 14
const TOT = NUM * NUM * NUM
function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2
}
function Cubes() {
  const _time = useRef(0)
  const positions = useRef([])
  const instance = useRef()
  const { clock } = useThree()
  const [objects] = useState(() => [...new Array(TOT)].map(() => new THREE.Object3D()))

  const update = useCallback(() => {
    positions.current = []
    const time = clock.getElapsedTime() / 6
    for (let z = -NUM / 2; z < NUM / 2; z += 1) {
      for (let y = -NUM / 2; y < NUM / 2; y += 1) {
        for (let x = -NUM / 2; x < NUM / 2; x += 1) {
          const fn = p3(time)
          const noise = fn(x, y, z)
          positions.current.push(noise > 0.5 ? 1 : 0)
        }
      }
    }
    return positions
  }, [clock])

  useFrame(() => {
    let id = 0
    if (_time.current === 0) {
      update()
    }
    for (let z = -NUM / 2; z < NUM / 2; z += 1) {
      for (let y = -NUM / 2; y < NUM / 2; y += 1) {
        for (let x = -NUM / 2; x < NUM / 2; x += 1) {
          const s = positions.current[id]
          const scale = easeInOutSine(lerp(objects[id].scale.x, s, 0.2))
          objects[id].position.set(x, y, z)
          objects[id].scale.set(scale, scale, scale)
          objects[id].updateMatrix()
          instance.current.setMatrixAt(id, objects[id++].matrix)
        }
      }
    }
    instance.current.instanceMatrix.needsUpdate = true
    _time.current += 1
    if (_time.current === 3) {
      _time.current = 0
    }
  })

  return (
    <instancedMesh position={[0.5, 0.5, 0.5]} receiveShadow castShadow ref={instance} args={[null, null, TOT]}>
      <roundedBoxBufferGeometry args={[0.98, 0.98, 0.98, 1, 0.05]} />
      <meshPhysicalMaterial color="ghostwhite" metalness={0} roughness={1} />
    </instancedMesh>
  )
}
const getRandomColor = () => niceColors[Math.floor(900 * Math.random())][2]

export default function App() {
  const [color, setColor] = useState(() => getRandomColor())
  console.log(color)
  return (
    <Canvas
      concurrent
      shadowMap
      colorManagement
      orthographic
      onClick={() => setColor(getRandomColor())}
      pixelRatio={[1, 1.5]}
      camera={{ position: [0, 0, 30], near: 0.1, far: 100, zoom: 20 }}>
      <color attach="background" args={['black']} />
      <spotLight
        color="antiquewhite"
        intensity={4}
        position={[10, 20, 60]}
        angle={Math.PI / 3}
        castShadow
        distance={70}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        penumbra={1}
      />
      <Light color={color} />
      <group rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <Cubes />
      </group>
    </Canvas>
  )
}
