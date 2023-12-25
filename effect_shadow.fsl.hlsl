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
    float4 ShadowColor : TEXCOORD0;
    float4 VP_0 : TEXCOORD1_0;
    float4 VP_1 : TEXCOORD1_1;
    float4 VP_2 : TEXCOORD1_2;
    float4 VP_3 : TEXCOORD1_3;
    float4 W_0 : TEXCOORD5_0;
    float4 W_1 : TEXCOORD5_1;
    float4 W_2 : TEXCOORD5_2;
    float4 W_3 : TEXCOORD5_3;
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

float4 PSMain(VSOutput _57)
{
    return (mod(_57.Pos.x + _57.Pos.y, 2.0f) < 1.0f) ? ShadowColor : 1.0f.xxxx;
}

void vert_main()
{
    VSInput _74;
    VSOutput _76 = VSMain(_74);
    VSOutput _78 = _76;
}

void main(SPIRV_Cross_Input stage_input)
{
    W[0] = stage_input.W_0;
    W[1] = stage_input.W_1;
    W[2] = stage_input.W_2;
    W[3] = stage_input.W_3;
    VP[0] = stage_input.VP_0;
    VP[1] = stage_input.VP_1;
    VP[2] = stage_input.VP_2;
    VP[3] = stage_input.VP_3;
    ShadowColor = stage_input.ShadowColor;
    vert_main();
}
