#version 450

layout(location = 0) in mat3 a;
layout(location = 5) in vec3 b;

layout(location = 0) out vec3 c;

void main() {
    c.x = sin(b.x);
}