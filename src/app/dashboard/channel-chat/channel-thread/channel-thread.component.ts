import { Component, Input, ViewChild } from '@angular/core';
import { Thread } from '../../../models/thread.class';
import { CommonModule } from '@angular/common';
import { EmojiMartComponent } from '../../emoji-mart/emoji-mart.component';
import { ChannelChatComponent } from '../channel-chat.component';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';
import { EmojiCommunicationService } from '../../../services/emoji-communication.service';
import { MessageReactionComponent } from '../message-reaction/message-reaction.component';
import { FullThreadComponent } from '../../full-thread/full-thread.component';
import { DashboardComponent } from '../../dashboard.component';

@Component({
  selector: 'app-channel-thread',
  standalone: true,
  imports: [
    CommonModule,
    MessageReactionComponent,
    EmojiMartComponent,
  ],
  templateUrl: './channel-thread.component.html',
  styleUrl: './channel-thread.component.scss'
})
export class ChannelThreadComponent {

  @Input() thread!: Thread;
  @ViewChild(MessageReactionComponent) messageReaction!: MessageReactionComponent;

  constructor(
    public channelChat: ChannelChatComponent,
    public dashboard: DashboardComponent
  ) { }

  formattedDatestamp(): any {
    return this.thread.getFormattedDatestamp();
  }

  formattedTimeStamp(): any {
    return this.thread.getFormattedTimeStamp();
  }  

  
}

