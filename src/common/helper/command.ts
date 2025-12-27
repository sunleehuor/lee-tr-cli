export function getValueOfCommand(command: string) {
    const commands = process.argv;
    for( const com of (commands || []) ) {
        const [ keys, value ] = com?.split?.("=");
        if( keys == command ) {
            return value;
        }
    }
}