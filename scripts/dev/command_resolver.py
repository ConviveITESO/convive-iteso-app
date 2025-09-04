import platform
import subprocess


# Resolve the command given for unix based or windows os
def resolve_command(command: list[str]):
    if platform.system() == "Windows":
        return command

    string_cmd = " ".join(command)
    return string_cmd


def resolve_parameter(parameter: str):
    if platform.system() == "Windows":
        return parameter
    return f"'{parameter}'"


# Resolves and runs a given command, handles error throwing
def run_command(command: list[str]):
    result = subprocess.run(
        resolve_command(command), shell=True, text=True, capture_output=True
    )
    print(result.stderr)
    if result.returncode != 0:
        raise RuntimeError(result.stderr)
