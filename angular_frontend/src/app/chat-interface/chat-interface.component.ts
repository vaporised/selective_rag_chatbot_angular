import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown'
import { SharedService } from '../shared.service';
import { Subscription } from 'rxjs';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  displayableContent: string;
}

@Component({
    selector: 'app-chat-interface',
    imports: [FormsModule, NgFor, MarkdownModule, CommonModule],
    templateUrl: './chat-interface.component.html',
    styleUrl: './chat-interface.component.css',
    standalone: true
})
export class ChatInterfaceComponent implements OnInit, OnDestroy, AfterViewChecked {
    private apiUrl = 'http://127.0.0.1:5000/chat';
    private paramSubscription = new Subscription();
    userMessage = "";
    messages: Message[] = []; // Store all message history
    isWaitingForResponse = false; // Keep track of whether assistant is thinking
    chatParameters!: {model: any, search: any};
    errorMessage = '';

    @ViewChild('chatContainer') private chatContainer!: ElementRef;

    constructor(private http: HttpClient, private sharedService: SharedService) {}

    ngOnInit() {
      this.chatParameters = this.sharedService.retrieveChatParameters();
    }

    sendMessage() {
      if (this.userMessage.trim() == '' || this.isWaitingForResponse || !this.chatParameters || !this.chatParameters.search.indexNameValid || this.errorMessage) {
        return; // Prevent sending messages on certain conditions
      }
      const userMessage = this.userMessage
      this.userMessage = '';
      this.messages.push({role: 'user', content: userMessage, displayableContent: userMessage});
      this.isWaitingForResponse = true;

      this.http
      .post<Message>(this.apiUrl, {
        messages: this.messages,
        parameters: this.chatParameters
      })
      .subscribe({
        next: (res) => {
          this.messages.push(res);
          this.isWaitingForResponse = false;
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.isWaitingForResponse = false;
          this.errorMessage = 'An error occurred while sending your message. Please try again.';
        }
      });
    }
    
    ngAfterViewChecked() {
      this.scrollToBottom();
    }
    
    private scrollToBottom() {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
    
    clearChat() {
      this.messages =[];
      this.errorMessage = '';
    }

    ngOnDestroy() {
      this.paramSubscription.unsubscribe();
    }
}
