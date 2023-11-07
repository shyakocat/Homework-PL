type InfoParams<T = void> {
  img_size : vec2<i32>
  dpi? : i32
  data
}

uniform params : InfoParams
var src_pic : tex2d<f32>
var swp_pic : tex2d<rgba32float, write>

WEIGHT : array<f32, 5> = [0.2, 0.1, 0.10, 0.1, 0.1]

@compute
fn cs_main(gid : vec3<u32>, lid : vec3<u32>) -> void {
  uv : vec2<i32> = gid.xy
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


