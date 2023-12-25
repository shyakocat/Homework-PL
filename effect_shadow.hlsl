
float4x4 W;
float4x4 VP;

float4 ShadowColor;


struct VSInput
{
	float3 Pos : POSITION;
};

struct VSOutput
{
	float4 Position : POSITION;
	float4 Pos : TEXCOORD;
};

    float mod(float x, float y)
{
    return x - y * floor(x / y);
}

float2 mod(float2 x, float2 y)
{
    return x - y * floor(x / y);
}

float3 mod(float3 x, float3 y)
{
    return x - y * floor(x / y);
}

float4 mod(float4 x, float4 y)
{
    return x - y * floor(x / y);
}

VSOutput VSMain(VSInput _27)
{
    VSOutput _30;
    _30.Pos = mul(float4(_27.Pos, 1.0f), W);
    _30.Pos.y = 0.0f;
    _30.Pos = mul(_30.Pos, VP);
    _30.Position = _30.Pos;
    return _30;
}

float4 PSMain(VSOutput _57) : COLOR
{
    return (mod(_57.Pos.x + _57.Pos.y, 2.0f) < 1.0f) ? ShadowColor : 1.0f.xxxx;
}

technique Main {
    pass P0 {
        CullMode = None;
        VertexShader = compile vs_2_0 VSMain();
        PixelShader = compile ps_2_0 PSMain();
    }
}
    