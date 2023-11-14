let { Parse, Formatter } = require("./spv");
const fs = require("fs");

s = `
type Info = (image_size : ivec2);

uniform params : Info;
var pic : tex2d;

fn main(gid : uvec3, lid: uvec3) {
    uv : ivec2 = gid.xy
    if (uv.x >= params.img_size.x || uv.y >= params.img_size.y) {
        return
    }

    temp = textureLoad(src_pic, uv, 0) * WEIGHT[0]
    uvMax = params.img_size - 1
    for (i = 1; i <= 4; ++i) {
      uvOffset = vec2<i32>(3, 0) * i
      temp += textureLoad(src_pic, (uv + uvOffset).clamp(0, uvMax), 0) * WEIGHT[i]
      temp += textureLoad(src_pic, (uv - uvOffset).clamp(0, uvMax), 0) * WEIGHT[i]
    }
    textureStore(swp_pic, uv, temp)
}

fn add(a : int, b : int) a+b
`;

s = `

out a : float;
out b : float;

fn main() -> void {
  for (i : int = 0; i < 3; i = i + 1) {
    b = 5.0f
  }
}

`;


ret = Parse(s);
//console.log(ret);
ret = Formatter(ret);
if (process.argv.length > 2) {
  file = process.argv[2];
  fs.writeFileSync(file, ret);
} else {
  console.log(ret);
}
