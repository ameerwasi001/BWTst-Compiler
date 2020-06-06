class Value:
    def added_to(self, other):
        return self.IllegalOperationError(other)

    def subbed_by(self, other):
        return self.IllegalOperationError(other)

    def multed_by(self, other):
        return self.IllegalOperationError(other)

    def dived_by(self, other):
        return self.IllegalOperationError(other)

    def copy(self):
        raise Exception("No copy method defined")

    def IllegalOperationError(self, other=None):
        if not other: other = self
        raise Exception(
            'Illegal Operation'
        )

class BWTNumber(Value):
    def __init__(self, value):
        super().__init__()
        self.value = float(value)

    def added_to(self, other):
        if isinstance(other, BWTNumber):
            return BWTNumber(self.value + other.value)
        else:
            return self.IllegalOperationError(other)

    def subbed_by(self, other):
        if isinstance(other, BWTNumber):
            return BWTNumber(self.value - other.value)
        else:
            return self.IllegalOperationError(other)

    def multed_by(self, other):
        if isinstance(other, BWTNumber):
            return BWTNumber(self.value * other.value)
        else:
            return self.IllegalOperationError(other)

    def dived_by(self, other):
        if isinstance(other, BWTNumber):
            if other.value != 0:
                return BWTNumber(self.value / other.value)
            else:
                raise Exception(
                    "Division by Zero"
                )
        else:
            return self.IllegalOperationError(other)

    def __int__(self):
        return int(self.value)

    def __float__(self):
        return float(self.value)

    def lt(self, other):
        if isinstance(other, BWTNumber):
            return Boolean(self.value < other.value)
        else:
            return self.IllegalOperationError(other)

    def lte(self, other):
        if isinstance(other, BWTNumber):
            return Boolean(self.value <= other.value)
        else:
            return self.IllegalOperationError(other)

    def gt(self, other):
        if isinstance(other, BWTNumber):
            return Boolean(self.value > other.value)
        else:
            return self.IllegalOperationError(other)

    def gte(self, other):
        if isinstance(other, BWTNumber):
            return Boolean(self.value >= other.value)
        else:
            return self.IllegalOperationError(other)

    def ee(self, other):
        if isinstance(other, BWTNumber):
            return Boolean(self.value == other.value)
        else:
            return self.IllegalOperationError(other)

    def ne(self, other):
        if isinstance(other, BWTNumber):
            return Boolean(self.value != other.value)
        else:
            return None, self.IllegalOperationError(other)

    def is_true(self):
        return self.value != 0

    def notted(self):
        return Boolean(not self.is_true())

    def anded(self, other):
        return Boolean((self.is_true()) and (other.is_true()))

    def ored(self, other):
        return Boolean((self.is_true()) or (other.is_true()))

    def copy(self):
        copy = BWTNumber(self.value)
        return copy

    def __repr__(self):
        return f"{self.value}"


class BWTString(Value):
    def __init__(self, value):
        super().__init__()
        self.value = value

    def added_to(self, other):
        if isinstance(other, BWTString):
            return BWTString(self.value + other.value)
        else:
            return self.IllegalOperationError(other)

    def subbed_by(self, other):
        if isinstance(other, BWTNumber):
            if other.value >= 0:
                return BWTString(self.value[int(other.value):])
            else:
                return BWTString(self.value[:int(other.value)])
        else:
            return self.IllegalOperationError(other)

    def multed_by(self, other):
        if isinstance(other, BWTNumber):
            return BWTString(self.value * int(other.value))
        else:
            return self.IllegalOperationError(other)

    def dived_by(self, other):
        if isinstance(other, BWTNumber):
            if len(self.value) > other.value:
                return BWTString(self.value[int(other.value)])
            else:
                raise Exception(
                    "List out of range"
                )
        else:
            return self.IllegalOperationError(other)

    def __int__(self):
        return str(self.value)

    def __float__(self):
        return str(self.value)

    def __str__(self):
        return str(self.value)

    def is_true(self):
        return len(self.value) != 0

    def ee(self, other):
        if isinstance(other, BWTString):
            return Boolean(self.value == other.value)
        else:
            return Boolean(0)

    def ne(self, other):
        if isinstance(other, BWTString):
            return Boolean(self.value != other.value)
        else:
            return Boolean(1)

    def notted(self):
        return Boolean(not self.is_true())

    def anded(self, other):
        return Boolean((self.is_true()) and (other.is_true()))

    def ored(self, other):
        return Boolean((self.is_true()) or (other.is_true()))

    def copy(self):
        copy = BWTString(self.value)
        return copy

    def __repr__(self):
        return f"{self.value}"

class List(Value):
    def __init__(self, elements):
        super().__init__()
        self.elements = elements

    def is_true(self):
        return len(self.elements) > 0

    def notted(self):
        return Boolean(not self.is_true())

    def anded(self, other):
        return Boolean((self.is_true()) and (other.is_true()))

    def ored(self, other):
        return Boolean((self.is_true()) or (other.is_true()))

    def copy(self):
        copy = List(self.value)
        return copy

    def __repr__(self):
        return f'[{", ".join([str(x) for x in self.elements])}]'


class Boolean(BWTNumber):
    def __init__(self, state):
        super().__init__(state)
        self.state = state

    def copy(self):
        copy = Boolean(self.value)
        return copy

    def __repr__(self):
        return 'true' if self.state else 'false'

class nilObject(BWTNumber):
    def __init__(self):
        super().__init__(0)

    def copy(self):
        copy = nilObject()
        return copy

    def __repr__(self):
        return 'nil'

nil = nilObject()
false = Boolean(0)
true = Boolean(1)
