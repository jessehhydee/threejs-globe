#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform float u_maxExtrusion;

void main() {

  vec3 newPosition = position;
  newPosition.xyz = newPosition.xyz * u_maxExtrusion;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
  // gl_Position = projectionMatrix * viewMatrix * vec4( position, 1.0 );

}