<script>
  import axios from "axios";
  export let content = "";
  export let name = "";
  export let date = "";
  export let avatar = "";
  export let profileId;
  export let commentId;
  export let episodeId;
  export let likes = 0;
  export let liked = false;
  export let logged = false;
  export let notSync = false;
  import {PUBLIC_API_URL} from "$env/static/public"
</script>

<div class="comment">
  <div class="right">
    <img src={avatar} alt="" class="avatar" />
  </div>
  <div class="left">
    <div class="top">
      <span class="name">{name}</span>
      <span class="date">{date}</span>
      {#if notSync}
        <span class="sync_alert">Not synced version</span>
      {/if}
    </div>
    <div class="bottom">
      <p class="text">
        {content}
      </p>
      <div class="actions">
        {#if logged}
          <div
            style={liked ? "background-color:#76f09f98;" : ""}
            class="button"
            on:click={async () => {
              await axios.post(
                `${PUBLIC_API_URL}/anime/episode/${episodeId}/comment/${commentId}/like/${profileId}`
              );
              likes = liked ? likes - 1 : likes + 1;
              liked = liked ? false : true;
            }}
          >
            {#if liked}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style="margin-right: 5px;"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="#1f1f1f"
                ><path
                  d="M720-120H320v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h218q32 0 56 24t24 56v80q0 7-1.5 15t-4.5 15L794-168q-9 20-30 34t-44 14ZM240-640v520H80v-520h160Z"
                /></svg
              >
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                style="margin-right: 5px;"
                fill="#1f1f1f"
                ><path
                  d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"
                /></svg
              >
            {/if}

            {likes}
          </div>
        {:else}
          <div class="button" style="cursor: default;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              style="margin-right: 5px;"
              fill="#1f1f1f"
              ><path
                d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"
              /></svg
            >
            {likes}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .comment {
    display: flex;
    margin: 10px;
    min-height: 100px;
    border: 1px solid #c4c3c3;
    border-radius: 10px;
    padding: 10px;
  }
  .comment .right {
    margin-right: 20px;
  }
  .comment .right img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }
  .comment .left .top {
    display: flex;
    margin-bottom: 10px;
  }
  .comment .left .top .name {
    display: inline-block;
    font-weight: bold;
    margin-right: 10px;
  }
  .comment .left .top .date {
    color: grey;
  }
  .comment .left .bottom .actions {
    margin-top: 10px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
  }
  div.button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px;
    border-radius: 5px;
    border: none;
    margin-right: 10px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
  }
  div.button:hover {
    background-color: rgba(218, 218, 218, 0.534);
  }
  span.sync_alert {
    display: inline-block;
    padding: 2px;
    border-radius: 5px;
    margin-left: 10px;
    background-color: rgb(255, 85, 85);
    color: rgb(82, 2, 2);
    font-weight: bold;
    font-size: 12px;
  }
</style>
