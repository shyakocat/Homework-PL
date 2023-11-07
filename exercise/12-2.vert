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
    float _34;
    vec4 _35;
    if (fancy_attribute < props.threshold)
    {
        _34 = 0.0;
        _35 = vec4(0.0);
    }
    else
    {
        _34 = 1.0;
        _35 = props.highly_exclusive_bits;
    }
    useful_output = _34;
    crucial_data = _35;
}

