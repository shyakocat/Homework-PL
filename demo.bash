glslc source.glsl -o output.spv         # 编译 glsl 文件为二进制文件
glslc source.glsl -o output.spvasm -S   # 编译 glsl 文件为汇编代码
glslc assembly.spvasm -o output.spv     # 转换汇编代码为二进制文件


spirv-dis output.spv -o output.spvasm   # 转换二进制文件为汇编代码
spirv-val output.spv                    # 验证二进制文件