let { Parse, Formatter } = require("./spv");
const fs = require("fs");
const cmd = require("node-cmd");

if (process.argv.length > 2) {
    file = process.argv[2];
    code = fs.readFileSync(file)
    ret = Parse(code);
    ret = Formatter(ret);
    filespvasm = file + ".spvasm"
    filespv = file + ".spv"
    filehlsl = file + ".hlsl"
    fs.writeFileSync(filespvasm, ret);
    sta = cmd.runSync(`glslc ${filespvasm} -o ${filespv}`)
    sta = cmd.runSync(`spirv-cross --hlsl ${filespv} --output ${filehlsl}`)
    hlsl = fs.readFileSync(filehlsl).toString()
    hlsl = hlsl.replaceAll(/(struct(.*?)};)|(static(.*?);)|(void main(.*?)})|(void vert_main(.*?)})/gs, "")
    hlsl = hlsl.replace(/(?<=PSMain(.*?)\))/, " : COLOR")
    hlsl = hlsl.trim()
    hlsl = `
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

    ` + hlsl + `

technique Main {
    pass P0 {
        CullMode = None;
        VertexShader = compile vs_2_0 VSMain();
        PixelShader = compile ps_2_0 PSMain();
    }
}
    `
    mmd_dir = `C:\\Users\\shy13\\source\\repos\\MMDIsland\\MMDIsland\\bin\\x64\\Debug\\Shader\\MMD_shadow.fx`
    fs.writeFileSync(mmd_dir, hlsl)
    fs.writeFileSync("effect_shadow.hlsl", hlsl)
}
else {
    console.log("please provide fsl file in command")
}