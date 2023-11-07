#version 450

precision mediump float;
layout (binding = 0) uniform sampler2D t_reflectance;
layout (location = 1) in vec4 i_ambient;
layout (location = 2) in float v_diffuse;
layout (location = 3) in vec2 v_texcoord;
layout (location = 0) out vec4 outColor;

vec2 BigMix() {
    vec4 v = vec4(1.0, 2.0, 3.0, 1.0);
    float v0 = v.x + v.r + v[0];
    vec3 v1 = v.xyz - v.rgb;
    vec4 v2 = v.xyzw * v.rgba;
    float v3 = abs(v0) + sign(v0) + floor(v0) + ceil(v0) + fract(v0) +
     mod(v0, 7.0) + min(v0, 6.0) + max(v0, float(5)) + 
     clamp(v0, -1.0, 1.0) + mix(v0, 100.0, 0.5) + step(v0, 0.0) + smoothstep(-1.0, 1.0, v0);
    vec4 v4 = radians(v2) + degrees(v2) + sin(v2) + cos(v2) + tan(v2) +
     asin(v2) + acos(v2) + atan(v2);
    vec3 v5 = pow(v1, v1) + exp(v1) + log(v1) + exp2(v1) + log2(v1) + sqrt(v1) + inversesqrt(v1);
    return vec2(length(v1.xy), distance(v1, v5)) + 
     vec2(dot(v2, v4), cross(v1, v1).g) + vec2(v0, v3) + 
     normalize(v).ba;
}


void main() {
    vec4 color = texture2D(t_reflectance, v_texcoord);

 //这里分解开来是 color*vec3(1,1,1)*v_diffuse + color*i_ambient
 //色*光*夹角cos + 色*环境光
    outColor = color * (vec4(v_diffuse) + i_ambient);
}