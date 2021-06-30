import * as React from 'react';
import { Component } from 'react';

export interface BackgroundProps {
    children?: any
}
 
export interface BackgroundState {
    theme: string
}
 
class Background extends React.Component<BackgroundProps, BackgroundState> {
    state = { theme: 'dark' }

    constructor(props: any) {
        super(props);
        console.log(props.children);
    }

    switchTheme(this: any) {
        if (this.state.theme === 'dark') {
            this.setState({
                theme: 'light'
            });
        } else {
            this.setState({
                theme: 'dark'
            });
        }
    }

    render() { 
        return ( 
            <div className='background' id={this.state.theme}>
                <button onClick={() => this.switchTheme()}>
                    Switch Theme
                </button>
                {this.props.children ? this.props.children : ''}
            </div>
        );
    }
}
 
export default Background;