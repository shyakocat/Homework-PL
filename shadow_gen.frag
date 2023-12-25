#version 450

struct VSInput
{
    vec3 Pos;
};

struct VSOutput
{
    vec4 Position;
    vec4 Pos;
};

layout(location = 0) in mat4 W;
layout(location = 5) in vec4 VP;
layout(location = 6) in vec4 ShadowColor;

VSOutput VSMain(VSInput vsIn)
{
    VSOutput vsOut;
    vsOut.Position = vec4(vsIn.Pos, 1.0) * W;
    vsOut.Position.y = 0.0;
    vsOut.Position *= VP;
    vsOut.Pos = vsOut.Position;
    return vsOut;
}

vec4 PSMain(VSOutput vsOut)
{
    bool t = mod(vsOut.Pos.x + vsOut.Pos.z, 2.0) < 1.0;
    return mix(vec4(0.0), ShadowColor, bvec4(t));
}

void main()
{
    VSInput vsIn;
    VSInput param = vsIn;
    VSOutput vsOut = VSMain(param);
    VSOutput param_1 = vsOut;
}

