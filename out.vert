#version 450

layout(location = 0) in float a;
layout(location = 0) out float b;

void main()
{
    float x;
    if (a < 0) x = -1; else x = 1;
    b = x;
}

