#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;

vec3 colorA = vec3(0.196, 0.631, 0.886);
vec3 colorB = vec3(0.192, 0.384, 0.498);

void main() {

  vec3  color = vec3(0.0);
  float pct   = abs(sin(u_time));
        color = mix(colorA, colorB, pct);

  gl_FragColor = vec4(color, 1.0);

}