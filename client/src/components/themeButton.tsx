import * as React from 'react';
import { Component } from 'react';

export interface ThemeButtonProps {
    
}
 
export interface ThemeButtonState {
    
}
 
class ThemeButton extends React.Component<ThemeButtonProps, ThemeButtonState> {
    state = { theme: 'dark' }
    render() { 
        const content = `Theme: ${this.state.theme}`;
        return (
            <button>
                {content}
            </button>
        );
    }
}
 
export default ThemeButton;