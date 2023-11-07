#version 450

layout(location = 0) in float fancy_attribute;
layout(location = 0) out float useful_output;
layout(location = 1) out vec4 crucial_data;

void main()
{
    useful_output = fancy_attribute;
    crucial_data = vec4(0.25, 0.25, 0.75, 1.0);
}

