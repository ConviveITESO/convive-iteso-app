import os
from command_resolver import run_command
import sys

nest_cli = "@nestjs/cli"


# for generating a resource in NestJS module
def generator(resource_type: str, name: str):
    return ["pnpm", "dlx", nest_cli, "g", resource_type, f"modules/{name}"]


# for adding the api module
def add_api_module(name: str, with_controller: bool, with_service: bool):
    os.chdir(os.path.abspath("./apps/api"))
    commands_to_run = [
        # generate initial module
        generator("module", name)
    ]

    if with_controller:
        commands_to_run.append(generator("controller", name))

    if with_service:
        commands_to_run.append(generator("service", name))

    for cmd in commands_to_run:
        print(cmd)
        run_command(cmd)


def main():
    module_name = ""
    as_default = False
    with_controller = False
    with_service = False

    # get the module name
    try:
        module_name = sys.argv[1]
    except IndexError as e:
        module_name = input("Please input module name: ")

    # get if default or with manual data
    try:
        as_default = sys.argv[2]
        if as_default == "--default":
            add_api_module(name=module_name, with_controller=True, with_service=True)
    except IndexError as e:
        with_controller_input = input("Add an HTTP Controller? (Y/N) (DEFAULT YES): ")
        with_service_input = input("Add a Service? (Y/N) (DEFAULT YES): ")

        if with_controller_input == "" or str.lower(with_controller_input) == "y":
            with_controller = True

        if with_service_input == "" or str.lower(with_service_input) == "y":
            with_service = True

        add_api_module(
            name=module_name, with_controller=with_controller, with_service=with_service
        )

    print(f"Module '{module_name}' created")


if __name__ == "__main__":
    main()
