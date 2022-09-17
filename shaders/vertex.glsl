#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform float u_maxExtrusion;

void main() {

  vec3 newPosition = position;
  if(u_maxExtrusion > 1.0) newPosition.xyz = newPosition.xyz * u_maxExtrusion + sin(u_time);
  else newPosition.xyz = newPosition.xyz * u_maxExtrusion;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

}