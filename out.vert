#version 450

in mat3 a;
in vec3 b;
out vec3 c;

float func(float _16)
{
    return sin(_16);
}

void main()
{
    c.x = func(b.x);
}

