#version 450

layout(location = 0) in mat3 a;
layout(location = 5) in vec3 b;

layout(location = 0) out vec3 c;

float func(float x) {
    return sin(x);
}

void main() {
    float t = a[0][0] < 0 ? -1.0f : 1.0f;
    c.x = func(b.x);
    for(int i = 1; i < 10; ++i) {
        if(i == 5)
            continue;
        if(i == 6)
            break;
    }
}