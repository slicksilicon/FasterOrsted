
export const TRISTATE_IGNORE    = 'ignore';
export const TRISTATE_NEGATIVE  = 'negative';
export const TRISTATE_POSITIVE  = 'positive'

export class TriState{    
    /**
     * @param {'negative'|'positive'|'ignore'} state
     */
    constructor(state){
        this.state = state;
    }

    get_bool(){
        if (this.state == 'ignore'){
            return false;
        }

        return true;
    }

    get(){
        return this.state;
    }
    
    /**
     * @param {'negative'|'positive'|'ignore'} state
     */
    set(state){
        this.state = state;
    }
}