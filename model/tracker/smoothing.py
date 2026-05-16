from collections import deque
import numpy as np


class EMA:
    """Exponential moving average for scalar or dict values."""

    def __init__(self, alpha: float = 0.3):
        self.alpha = alpha
        self._val = None

    def update(self, x):
        if self._val is None:
            self._val = x
        elif isinstance(x, dict):
            self._val = {k: self.alpha * x[k] + (1 - self.alpha) * self._val.get(k, x[k]) for k in x}
        else:
            self._val = self.alpha * x + (1 - self.alpha) * self._val
        return self._val

    @property
    def value(self):
        return self._val

    def reset(self):
        self._val = None


class WindowSmooth:
    """Rolling-window mean for scalars."""

    def __init__(self, maxlen: int = 5):
        self._buf: deque = deque(maxlen=maxlen)

    def update(self, x: float) -> float:
        self._buf.append(x)
        return float(np.mean(self._buf))

    def reset(self):
        self._buf.clear()
