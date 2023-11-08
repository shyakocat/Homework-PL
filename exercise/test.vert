#version 450

layout(location = 1) out int sm;

void main()
{
    sm = 0;
    for (int i = 1; i <= 10; ++i)
        sm += i < 5 ? i : i * i;
}

