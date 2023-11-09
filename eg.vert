#version 450

layout(location = 0)in float a;
layout(location = 0)out float b;

void main() {
    b = (-a) * 4 + (a / a);
}