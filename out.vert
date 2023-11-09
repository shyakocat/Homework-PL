#version 450

in float a;
out float b;

void main()
{
    b = -(a * (4.0 + (a / a)));
}

