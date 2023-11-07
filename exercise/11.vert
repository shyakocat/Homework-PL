#version 450

layout(binding = 3, std140) uniform object_properties
{
    float threshold;
    vec4 highly_exclusive_bits;
} props;

layout(location = 0) in float fancy_attribute;
layout(location = 0) out float useful_output;
layout(location = 1) out vec4 crucial_data;

void main()
{
    if (fancy_attribute < props.threshold)
    {
        useful_output = 0.0;
        crucial_data = vec4(0.0);
    }
    else
    {
        useful_output = 1.0;
        crucial_data = props.highly_exclusive_bits;
    }
}

