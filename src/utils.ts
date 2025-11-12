export const isValidHexColor = (color: string) => {
    if (!color){
        return false;
    }

    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(color);
}