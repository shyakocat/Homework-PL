/* 本质上 */
type fn::float->float->float = (id : int);
fn __call__(self : fn::float->float->float, _1 : float, _2 : float) -> float
{
    if (self.id == 1) f1(_1, _2) else 
    if (self.id == 2) f2(_1, _2) else
    ... else
    f10(_1, _2)
}