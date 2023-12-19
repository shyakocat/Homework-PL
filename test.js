let { Parse, Formatter } = require("./spv");
const fs = require("fs");

s = `

in MVP : mat3;
in Pos : vec3;
out Out : vec3;

fn add(a : float, b : float) -> float {
  return a + b
}

fn main() {
  Out = Pos * MVP;

  let f : fn::int->int = (x:int) => x*2

  let tmp : float = 3.0f;
  for (let i : int = 1; i <= 4; i = i + 1) {
    if (i == 2) tmp = tmp.add(i)
    else tmp = sqrt(tmp)
  }

  Out.x = tmp

  let v : vec2 = Out.yz;
    
  for (let u : vec3 = Out.yyz; u.x + v.x < 10; v.y = v.y + 1.0f) {
    if (u.y * v.y < 10) break;
    if (u.y / v.z > 0) continue;
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
