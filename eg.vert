#version 450

layout(location = 0)in float a;
layout(location = 0)out float b;

void main() {
    if (a < 0) b = -1;
    else b = 1;
}