import * as React from 'react';
import { Component } from 'react';
import '../styles/index.css';

interface Message {
    username: string,
    content: string
}

export interface ChatProps {
}
 
export interface ChatState {
    messages: Array<Message>
}
 
class Chat extends React.Component<ChatProps, ChatState> {
    state = { messages: [] }

    intervalID: NodeJS.Timeout | undefined;

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
        this.intervalID = setInterval(
            () => this.getMessages(),
            1000
        );
    }

    componentWillUnmount() {
        if (this.intervalID) {
            clearInterval(this.intervalID);
        }
    }

    async getMessages() {
        const messages: Array<Message> = await fetch('/get_messages')
            .then(res => res.json())
            .then(json => json)
        
        this.setState({
            messages: messages
        })
    }

    render() { 
        return (
            <div className='chat'>
                {this.state.messages.map((message: any, n: number) => {
                    return (
                        <div className={`message${n}`} key={`m${n}`}>
                            <h3>{message.username}: {message.content}</h3>
                        </div>
                    );
                })}
            </div>
        );
    }
}
 
export default Chat;