#version 450

layout(location = 0) in mat3 a;
layout(location = 5) in vec3 b;

layout(location = 0) out vec3 c;

void main() {
    for (int i = 0; i < 3; ++i) {
        c[i] = 2.0f;
    }

    c = b * a;
    mat3 m = mat3(1.0f);
    m[1] = b;
    m[2][0] = 3.1f;
}