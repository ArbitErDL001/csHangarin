from django.contrib.auth import logout
from django.shortcuts import redirect

from allauth.account.adapter import DefaultAccountAdapter


class AccountAdapter(DefaultAccountAdapter):
    def post_login(self, request, user, *, signup, **kwargs):
        if signup:
            logout(request)
            return redirect('account_login')
        return super().post_login(request, user, signup=signup, **kwargs)
