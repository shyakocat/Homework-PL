#version 450

layout(location = 1) out float val;

void swap(inout float a, inout float b) {
    float t = a; a = b; b = t;
}

void main()
{
    float a = 1.0, b = 2.0;
    swap(a, b);
    val = b;
}

