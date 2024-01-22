import { Plane, shaderMaterial } from '@react-three/drei'
import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, extend, useThree } from 'react-three-fiber'
import lerp from 'lerp'

const LightMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color(0.2, 0.0, 0.1) },
  `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  `
    varying vec2 vUv;
    uniform vec3 color;
    uniform float time;

    #ifndef PI
    #define PI 3.141592653589793
    #endif
    #ifndef HALF_PI
    #define HALF_PI 1.5707963267948966
    #endif

    float elasticIn(float t) {
      return sin(13.0 * t * HALF_PI) * pow(2.0, 10.0 * (t - 1.0));
    }

    float bounceOut(float t) {
      const float a = 4.0 / 11.0;
      const float b = 8.0 / 11.0;
      const float c = 9.0 / 10.0;
    
      const float ca = 4356.0 / 361.0;
      const float cb = 35442.0 / 1805.0;
      const float cc = 16061.0 / 1805.0;
    
      float t2 = t * t;
    
      return t < a
        ? 7.5625 * t2
        : t < b
          ? 9.075 * t2 - 9.9 * t + 3.4
          : t < c
            ? ca * t2 - cb * t + cc
            : 10.8 * t * t - 20.52 * t + 10.72;
    }
    
    float bounceInOut(float t) {
      return t < 0.5
        ? 0.5 * (1.0 - bounceOut(1.0 - t * 2.0))
        : 0.5 * bounceOut(t * 2.0 - 1.0) + 0.5;
    }

    void main() {
        float dist = max(1.0 - length(vUv - 0.5) * 2.0, 0.0);
        float osc =  0.1 * (1.0 + sin(time)) + 0.1 * (1.0 + cos(time * 4.0));
        gl_FragColor = vec4(mix(color, vec3(1.0), elasticIn(dist)) * (bounceInOut(osc) + dist), dist );
    }
  `
)

extend({ LightMaterial })

export default function Light({ color, ...props }) {
  const ref = useRef()
  const refMat = useRef()
  const { size } = useThree()
  useFrame(({ mouse, clock }) => {
    ref.current.position.x = lerp(ref.current.position.x, (mouse.x * size.width) / 40, 0.1)
    ref.current.position.y = lerp(ref.current.position.y, (mouse.y * size.height) / 40, 0.1)
    refMat.current.time = clock.elapsedTime
  })

  return (
    <pointLight
      intensity={2}
      decay={2}
      castShadow
      distance={70}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      ref={ref}
      color={color}
      {...props}>
      <Plane args={[5, 5]}>
        <lightMaterial ref={refMat} color={color} transparent blending={THREE.AdditiveBlending} depthTest={true} depthWrite={false} />
      </Plane>
    </pointLight>
  )
}
