#version 450

layout(binding = 3, std140) uniform object_properties
{
    vec4 shininess;
    vec4 smoothness;
} props;

layout(location = 0) in vec4 fancy_varying;
layout(location = 0) out vec4 beautiful_color;
layout(location = 1) out vec4 physicsy_properties;

void main()
{
    beautiful_color = fancy_varying * (vec4(1.0) - props.shininess);
    physicsy_properties = (-props.smoothness) / props.shininess;
}

