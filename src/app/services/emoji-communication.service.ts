import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmojiCommunicationService {

  private emojiEventSource = new Subject<any>();
  emojiEvent$ = this.emojiEventSource.asObservable();

  emitEmojiEvent(emoji: any, sender: string, threadId: string) {
    this.emojiEventSource.next({ emoji, sender, threadId });
  }
}