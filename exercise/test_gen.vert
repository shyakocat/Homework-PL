#version 450

layout(location = 1) out float val;

void swap(inout float a, inout float b)
{
    float t = a;
    a = b;
    b = t;
}

void main()
{
    float a = 1.0;
    float b = 2.0;
    float param = a;
    float param_1 = b;
    swap(param, param_1);
    a = param;
    b = param_1;
    val = b;
}

