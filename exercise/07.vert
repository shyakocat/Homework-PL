#version 450

layout(binding = 3, set = 2, std140) uniform object_properties
{
    vec4 shininess;
    vec4 smoothness;
} props;

layout(location = 0) in float fancy_attribute;
layout(location = 0) out float useful_output;
layout(location = 1) out vec4 crucial_data;

void main()
{
    useful_output = fancy_attribute;
}

