float Num1 = 0;
float &RefOne = Num1;

void test()
{
    RefOne = 3;
}

void valid()
{
    int A;
    int &RefA = A;

    A = 3;
}