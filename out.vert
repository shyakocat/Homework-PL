#version 450

in mat3 MVP;
in vec3 Pos;
out vec3 Out;

float add(float _26, float _28)
{
    return _26 + _28;
}

void main()
{
    Out = Pos * MVP;
    float _40 = 3.0;
    for (int _42 = 1; _42 <= 4; _42++)
    {
        float _62;
        if (_42 == 2)
        {
            float _58 = add(_40, _42);
            _40 = _58;
            _62 = _58;
        }
        else
        {
            float _60 = _40;
            float _61 = sqrt(_60);
            _40 = _61;
            _62 = _61;
        }
    }
    Out.x = _40;
    vec2 _72 = Out.yz;
    vec3 _76 = Out.yyz;
    for (; (_76.x + _72.x) < 10; _72.y += 1.0)
    {
        if ((_76.y * _72.y) < 10)
        {
            break;
        }
        if ((_76.y / float(_72.x)) > 0)
        {
            continue;
        }
    }
}

