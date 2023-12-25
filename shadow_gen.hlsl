struct VSInput
{
    float3 Pos;
};

struct VSOutput
{
    float4 Position;
    float4 Pos;
};

static float4x4 W;
static float4x4 VP;
static float4 ShadowColor;

struct SPIRV_Cross_Input
{
    float4x4 W : TEXCOORD0;
    float4x4 VP : TEXCOORD17;
    float4 ShadowColor : TEXCOORD33;
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

VSOutput VSMain(VSInput vsIn)
{
    VSOutput vsOut;
    vsOut.Position = mul(float4(vsIn.Pos, 1.0f), W);
    vsOut.Position.y = 0.0f;
    vsOut.Position = mul(vsOut.Position, VP);
    vsOut.Pos = vsOut.Position;
    return vsOut;
}

float4 PSMain(VSOutput vsOut)
{
    bool t = mod(vsOut.Pos.x + vsOut.Pos.z, 2.0f) < 1.0f;
    bool4 _76 = t.xxxx;
    return float4(_76.x ? ShadowColor.x : 0.0f.xxxx.x, _76.y ? ShadowColor.y : 0.0f.xxxx.y, _76.z ? ShadowColor.z : 0.0f.xxxx.z, _76.w ? ShadowColor.w : 0.0f.xxxx.w);
}

void frag_main()
{
    VSInput vsIn;
    VSInput param = vsIn;
    VSOutput vsOut = VSMain(param);
    VSOutput param_1 = vsOut;
}

void main(SPIRV_Cross_Input stage_input)
{
    W = stage_input.W;
    VP = stage_input.VP;
    ShadowColor = stage_input.ShadowColor;
    frag_main();
}
