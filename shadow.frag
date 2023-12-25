#version 450

layout(location = 0) in mat4 W;
layout(location = 17) in mat4 VP;
layout(location = 33) in vec4 ShadowColor;

struct VSInput
{
	vec3 Pos;
};

struct VSOutput
{
	vec4 Position;
	vec4 Pos;
};


VSOutput VSMain(VSInput vsIn)
{
	VSOutput vsOut;
	vsOut.Position = W * vec4(vsIn.Pos, 1.0);
	vsOut.Position.y = 0;
	vsOut.Position = VP * vsOut.Position;
	vsOut.Pos = vsOut.Position;
	return vsOut;
}

vec4 PSMain(VSOutput vsOut)
{
	bool t = mod(vsOut.Pos.x + vsOut.Pos.z, 2.0f) < 1.0f;
	return t ? ShadowColor : vec4(0.0f, 0.0f, 0.0f, 0.0f); 
}

void main() {
    VSInput vsIn;
    VSOutput vsOut = VSMain(vsIn);
    PSMain(vsOut);
}